import { App, aws_ec2, aws_ecs, aws_ecs_patterns, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class SonarqubeStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // vpc for ecs cluster with fargate
    const vpc = new aws_ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
    });

    // ecs cluster with fargate
    const cluster = new aws_ecs.Cluster(this, 'Cluster', {
      clusterName: 'my-cluster',
      vpc: vpc,
    });

    const loadBalancedFargateService = new aws_ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      memoryLimitMiB: 4096,
      desiredCount: 1,
      cpu: 1024,
      protocol: ApplicationProtocol.HTTPS,
      redirectHTTP: true,
      taskImageOptions: {
        // image: aws_ecs.ContainerImage.fromAsset('src/containers'),
        image: aws_ecs.ContainerImage.fromRegistry('sonarqube:lts-community'),
        // taskRole: taskRole,
        // command: ['-Dsonar.search.javaAdditionalOpts=-Dnode.store.allow_mmapfs=false'],
        environment: {
          SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: 'true',
        },
        containerPort: 9000,
      },
      publicLoadBalancer: true,
    });

    // loadBalancedFargateService.targetGroup.healthCheck = {
    //   path: '/health',
    //   // interval: cdk.Duration.seconds(60),
    //   // timeout: cdk.Duration.seconds(5),
    //   // healthyHttpCodes: '200',
    // };
    // Output
    new CfnOutput(this, 'web console url', {
      value: loadBalancedFargateService.loadBalancer.loadBalancerDnsName,
      description: 'Sonarqube web portal url',
    });

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new SonarqubeStack(app, 'sonarqube-cdk-dev', { env: devEnv });
// new MyStack(app, 'sonarqube-cdk-prod', { env: prodEnv });

app.synth();
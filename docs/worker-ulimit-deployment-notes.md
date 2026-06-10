# Worker 文件句柄限制部署记录

## 背景

在一次 AWS 全量扫描中，worker 扫描 17 个 region 时反复出现类似日志：

```text
[Errno 24] Too many open files
SSL validation failed for https://sts.ap-northeast-1.amazonaws.com/
AWSAssumeRoleError
```

任务本身仍然继续推进，但 worker 已经碰到了进程可打开文件/连接数量的上限，部分 AWS region 或 service 的 API 调用失败。

## 影响

- 这是部署/运行参数问题为主，不是前端、报告下载、metadata 翻译代码导致的。
- 如果扫描最终进入 `completed`，报告通常仍然可以生成和下载。
- 但如果扫描期间出现大量 `Too many open files`，部分服务或 region 的采集可能不完整。
- 因此，这类扫描产出的报告可以用于验证流程，但不建议当作严格完整的全量审计报告。

## 根因

当前 worker 进程的限制是：

```text
Max open files soft=1024 hard=524288
```

AWS 全量扫描会并发访问多个 region 和大量 AWS 服务。Prowler/botocore 在这个过程中会打开很多 HTTPS 连接、证书文件、AWS service model 文件和 socket。

`1024` 的 soft limit 对全量扫描偏低，所以扫描后段容易触发：

```text
Too many open files
```

这不是 CPU 或内存太小的典型问题，而是 worker 进程的文件句柄限制太低。

## Docker Compose 配置

在 `worker` service 里增加：

```yaml
services:
  worker:
    ulimits:
      nofile:
        soft: 65535
        hard: 65535
```

如果 `worker-beat` 只是负责调度任务，一般不需要同样的高限制。  
如果某个部署里 `worker-beat` 也会执行类似扫描的重任务，可以给它也加同样配置。

## 重建 worker

需要在发起全量扫描前完成配置并重建 worker。  
不要在扫描任务运行中重启 worker，除非你明确要中断或重试这条任务。

普通 Compose 部署：

```bash
docker compose up -d --force-recreate worker
```

指定 project 和 compose 文件：

```bash
docker compose -p cspm-backend-main-restore -f docker-compose.restore-existing-image.yml up -d --force-recreate worker
```

如果当前 compose 文件里没有 `worker` service，需要先补上 worker 的 service 定义，再通过 compose 重建。  
尽量避免长期使用手工创建的 worker 容器，否则下次部署时配置不容易复现。

## 部署后验证

查看 worker 容器内的文件句柄限制：

```bash
docker exec cspm-backend-main-restore-worker-1 sh -lc "ulimit -n && cat /proc/1/limits | grep -i 'open files'"
```

期望看到：

```text
65535
Max open files            65535                65535                files
```

确认 Celery worker 在线：

```bash
docker exec cspm-backend-main-restore-worker-1 sh -lc "cd /home/prowler/backend && poetry run celery -A config.celery inspect ping --timeout=5"
```

查看是否有正在执行的扫描任务：

```bash
docker exec cspm-backend-main-restore-worker-1 sh -lc "cd /home/prowler/backend && poetry run celery -A config.celery inspect active --timeout=5"
```

## 运行建议

- AWS 全量扫描时，worker 的 `nofile` 建议至少设置为 `65535`。
- worker 是扫描重负载容器，资源优先级应该高于 API 容器。
- 不要在同一个 worker 上同时跑太多全量扫描。
- 本地或低资源环境里，建议先用少量 region/check 验证链路，再跑全量。
- 如果提高 `nofile` 后仍然碰到限制，可以降低扫描并发，或者按 region/provider 拆分扫描。


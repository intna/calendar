# 收益日历

Polymarket 钱包的每日收益记录。界面以黑、白、黄为主，按日、周、月、年查看收益。

余额存在 MongoDB。充值和提现单独记账，不会被算进盈亏。

## 收益怎么算

第一天记入的余额是起点，当天不产生收益。之后每次记入：

**收益 = 本次余额 − 上次余额 − 期间充值 + 期间提现**

例如钱包有 800 U，提现 500 U，第二天余额 300 U，收益是 0。充值同样从余额变化里剔除。

请记入当天结束时的余额。起点当天的流水不参与计算；两次余额之间如果隔了几天，中间的盈亏和流水会合并记在下一次记入的日期。

## 在服务器上运行 MongoDB

应用和数据库放在同一台机器上。数据库只监听本机 `127.0.0.1`，不要把 `27017` 端口开放到公网。服务器现在没有 MongoDB 也可以，不需要用系统包安装它。

先安装 curl，再安装 Docker（Ubuntu / Debian）：

以下命令按 root 登录来写，不需要 sudo：

```bash
apt update
apt install -y ca-certificates curl
curl -fsSL https://get.docker.com | sh
```

再安装 Node.js 22（自带 npm）：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v
npm -v
```

然后进入项目目录：

```bash
docker compose up -d
docker compose ps
```

`mongo` 显示为 `running` 后，保持 `.env` 为：

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/polymarket
```

然后启动网站：

```bash
npm install
npm run build
npm start
```

容器会随服务器重启自动拉起。查看日志用 `docker compose logs -f mongo`，停止用 `docker compose stop`。

## 本地运行

需要 Node.js 20+，以及一个 MongoDB。

```bash
docker compose up -d
npm install
npm run dev
```

浏览器打开 http://localhost:3000 。

默认连接串在 `.env`：

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/polymarket
```

服务器上如果 MongoDB 不在本机，改成实际地址，例如：

```bash
MONGODB_URI=mongodb://用户:密码@127.0.0.1:27017/polymarket?authSource=admin
```

生产运行：

```bash
npm install
npm run build
npm start
```

`npm test` 会检查收益公式，不需要启动数据库。

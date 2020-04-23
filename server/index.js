const cluster = require('cluster')
const numCPUs = require('os').cpus().length
// const express = require('express')
// const app = express()
console.log(numCPUs)
function startServer () {
  // using all the cpu your machine has to offer to maximize cpu usage and to increase efficiency
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('online', (worker) => {
    console.log(`worker is online, Worker Id: ${worker.id}`)
  })
  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`)
    cluster.fork()
  })
}

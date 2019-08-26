from multiprocessing import Process, Queue
import os, time, random
import socket
import threading
import json
import asyncio
import inspect
from aiohttp import web, WSMsgType
import zmq
from asyncio import sleep


def sst_write(rpi_host='192.168.1.100', rpi_port=9000, zmq_host='*', zmq_port=5556):
    """
    A process, listened on socket://rpi_host:port,
        receive odas Sound Source Tracking(SST) json format data in bytes.
    Reassemble json byte frames and publish using zmq on tcp://zmq_host:zmq_port.
    :return: None
    """
    write_pid = os.getpid()
    print('#Write Process# %s start' % write_pid)
    bind_ip, bind_port = rpi_host, rpi_port
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((bind_ip, bind_port))
    server.listen(5)  # max backlog of connections
    print('#Write Process# listening on {}:{}'.format(bind_ip, bind_port))
    client_socket, address = server.accept()
    print('#Write Process# accepted connection from {}:{}'.format(address[0], address[1]))

    context = zmq.Context()
    zmq_socket = context.socket(zmq.PUB)
    zmq_socket.bind(f"tcp://{zmq_host}:{zmq_port}")

    temp = b''
    while True:
        t = 0
        temp = client_socket.recv(1024)
        for i in range(5):
            t = temp.find(b'}', t) + 1
        zmq_socket.send(temp[:t])
        temp = temp[t:]


def sst_read(zmq_host='192.168.1.108', zmq_port=5556, aio_host='0.0.0.0', aio_port=8080, verbose=False):
    """
    A process, used for subscribing zmq socket on tcp://zmq_host:zmq_port,
        receiving Sound Source Tracking(SST) data frames.
    In the meantime the process runs an aiohttp server on ws://aio_host:aio_port,
        sending SST data frames to user browser via websocket connection.
    User browser websocket-client should send a 'received' message after every data frame received,
        to tell the server 'last message received, please send next.'
    :output: Sound Source Tracking output like this:
    {
        "timeStamp": 45602,
        "src": [
            { "id": 43, "tag": "dynamic", "x": 0.025, "y": 0.128, "z": 0.991, "activity": 1.000 },
            { "id": 0, "tag": "", "x": 0.000, "y": 0.000, "z": 0.000, "activity": 0.000 },
            { "id": 0, "tag": "", "x": 0.000, "y": 0.000, "z": 0.000, "activity": 0.000 },
            { "id": 0, "tag": "", "x": 0.000, "y": 0.000, "z": 0.000, "activity": 0.000 }
        ]
    }
    :return: None
    """
    read_pid = os.getpid()
    print('#Read  Process# %s start' % read_pid)
    routes = web.RouteTableDef()

    context = zmq.Context()
    zmq_socket = context.socket(zmq.SUB)

    print("Collecting updates from odas publisher...")
    zmq_socket.connect(f"tcp://{zmq_host}:{zmq_port}")
    zmq_socket.setsockopt_string(zmq.SUBSCRIBE, '{')

    @routes.get('/ws')
    async def websocket_handler(request):
        print('websocket connection open')

        ws = web.WebSocketResponse()
        await ws.prepare(request)
        c = 0
        await ws.send_str(zmq_socket.recv_string())
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                if msg.data == 'close':
                    print('websocket connection close')
                    await ws.close()
                else:
                    c += 1
                    tmp = zmq_socket.recv_string()
                    await ws.send_str(tmp)
                    if verbose:
                        c += 1
                        print(f'\r{c}', end='', flush=True)
                    # TODO: debug jump, delete later
                    # for i in range(100):
                    #     zmq_socket.recv_string()
            elif msg.type == WSMsgType.ERROR:
                print('ws connection closed with exception %s' %
                      ws.exception())
        return ws

    app = web.Application()
    app.add_routes(routes)
    web.run_app(app, host=aio_host, port=aio_port)


def ssl_write(rpi_host='192.168.1.100', rpi_port=9001, zmq_host='*', zmq_port=5557):
    """
    A process, listened on socket://rpi_host:port,
        receive odas Sound Source Localization(SSL) json format data in bytes.
    Reassemble json byte frames and publish using zmq on tcp://zmq_host:zmq_port.
    :return: None
    """
    write_pid = os.getpid()
    print('#Write Process# %s start' % write_pid)
    bind_ip, bind_port = rpi_host, rpi_port
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((bind_ip, bind_port))
    server.listen(5)  # max backlog of connections
    print('#Write Process# listening on {}:{}'.format(bind_ip, bind_port))
    client_socket, address = server.accept()
    print('#Write Process# accepted connection from {}:{}'.format(address[0], address[1]))

    context = zmq.Context()
    zmq_socket = context.socket(zmq.PUB)
    zmq_socket.bind(f"tcp://{zmq_host}:{zmq_port}")

    temp = b''
    while True:
        t = 0
        temp = client_socket.recv(1024)
        for i in range(5):
            t = temp.find(b'}', t) + 1
        zmq_socket.send(temp[:t])
        temp = temp[t:]


def ssl_read(zmq_host='192.168.1.108', zmq_port=5557, aio_host='0.0.0.0', aio_port=8081, verbose=False):
    """
    A process, used for subscribing zmq socket on tcp://zmq_host:zmq_port,
        receiving Sound Source Localization(SSL) data frames.
    In the meantime the process runs an aiohttp server on ws://aio_host:aio_port/ws,
        sending SSL data frames to user browser via websocket connection.
    User browser websocket-client should send a 'received' message after every data frame received,
        to tell the server 'last message received, please send next.'
    :output: Sound Source Localization output like this:
    {
        "timeStamp": 45608,
        "src": [
            { "x": 0.132, "y": 0.181, "z": 0.975, "E": 0.557 },
            { "x": 0.198, "y": 0.342, "z": 0.918, "E": 0.130 },
            { "x": 0.000, "y": 0.273, "z": 0.962, "E": 0.018 },
            { "x": 0.000, "y": 0.339, "z": 0.941, "E": 0.006 }
        ]
    }
    :return: None
    """
    read_pid = os.getpid()
    print('#Read  Process# %s start' % read_pid)
    routes = web.RouteTableDef()

    context = zmq.Context()
    zmq_socket = context.socket(zmq.SUB)

    print("Collecting updates from odas publisher...")
    zmq_socket.connect(f"tcp://{zmq_host}:{zmq_port}")
    zmq_socket.setsockopt_string(zmq.SUBSCRIBE, '{')

    @routes.get('/ws')
    async def websocket_handler(request):
        print('websocket connection open')

        ws = web.WebSocketResponse()
        await ws.prepare(request)
        c = 0
        await ws.send_str(zmq_socket.recv_string())
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                if msg.data == 'close':
                    print('websocket connection close')
                    await ws.close()
                else:
                    tmp = zmq_socket.recv_string()
                    await ws.send_str(tmp)
                    if verbose:
                        c += 1
                        print(f'\r{c}', end='', flush=True)
                    # TODO: debug jump, delete later
                    # for i in range(100):
                    #     zmq_socket.recv_string()
            elif msg.type == WSMsgType.ERROR:
                print('ws connection closed with exception %s' %
                      ws.exception())
        return ws

    app = web.Application()
    app.add_routes(routes)
    web.run_app(app, host=aio_host, port=aio_port)


if __name__ == '__main__':
    try:
        # p_ssl_w = Process(target=ssl_write)
        # p_sst_w = Process(target=sst_write)
        p_ssl_r = Process(target=ssl_read, kwargs={"verbose": True})
        # p_ssl_r = Process(target=ssl_read)
        p_sst_r = Process(target=sst_read)
        # 启动子进程pw，写入:
        # p_ssl_w.start()
        # p_sst_w.start()
        # 启动子进程pr，读取:
        p_ssl_r.start()
        p_sst_r.start()
        # 等待pw结束:
        # p_ssl_w.join()
        # p_sst_w.join()
        # pr进程里是死循环，无法等待其结束，只能强行终止:
        # pw.terminate()
        # pr.terminate()
    except KeyboardInterrupt:
        # p_ssl_w.terminate()
        # p_sst_w.terminate()
        p_ssl_r.terminate()
        p_sst_r.terminate()
        print('KeyboardInterrupt pw pr Terminated')

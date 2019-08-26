from multiprocessing import Process
import os
import socket
import zmq


def sst_write(rpi_host='0.0.0.0', rpi_port=9000, zmq_host='*', zmq_port=5556):
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


def ssl_write(rpi_host='0.0.0.0', rpi_port=9001, zmq_host='*', zmq_port=5557):
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


if __name__ == '__main__':
    try:
        p_ssl_w = Process(target=ssl_write)
        p_sst_w = Process(target=sst_write)
        # p_ssl_r = Process(target=ssl_read, kwargs={"verbose": True})
        # 启动子进程pw，写入:
        p_ssl_w.start()
        p_sst_w.start()
        # 等待pw结束:
        p_ssl_w.join()
        p_sst_w.join()
    except KeyboardInterrupt:
        p_ssl_w.terminate()
        p_sst_w.terminate()
        print('KeyboardInterrupt pw pr Terminated')

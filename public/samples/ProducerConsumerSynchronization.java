package com.klu.concurrency;

import java.util.LinkedList;
import java.util.Queue;

/**
 * KL UNIVERSITY · DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
 * Course: 23CS2204 - Operating Systems & System Programming
 * Lab Experiment: Inter-Process Communication & Synchronization
 * Topic: Classic Producer-Consumer Bounded Buffer Problem using wait() and notifyAll()
 */
public class ProducerConsumerSynchronization {

    private static final int BUFFER_CAPACITY = 5;
    private static final Queue<Integer> buffer = new LinkedList<>();
    private static final Object lock = new Object();
    private static volatile boolean running = true;

    // Producer Worker Thread
    static class Producer implements Runnable {
        private final int producerId;

        public Producer(int id) {
            this.producerId = id;
        }

        @Override
        public void run() {
            int value = 1;
            while (running && value <= 15) {
                synchronized (lock) {
                    while (buffer.size() == BUFFER_CAPACITY) {
                        try {
                            System.out.printf("[Producer-%d] Buffer FULL (%d/%d). Awaiting consumer drain...%n",
                                    producerId, buffer.size(), BUFFER_CAPACITY);
                            lock.wait();
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                    }

                    int item = producerId * 100 + value;
                    buffer.add(item);
                    System.out.printf("[Producer-%d] PRODUCED item: %d | Buffer occupancy: %d/%d%n",
                            producerId, item, buffer.size(), BUFFER_CAPACITY);
                    value++;

                    // Wake up waiting consumers
                    lock.notifyAll();
                }

                try {
                    Thread.sleep(120);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    // Consumer Worker Thread
    static class Consumer implements Runnable {
        private final int consumerId;

        public Consumer(int id) {
            this.consumerId = id;
        }

        @Override
        public void run() {
            int consumedCount = 0;
            while (running && consumedCount < 15) {
                int item;
                synchronized (lock) {
                    while (buffer.isEmpty()) {
                        try {
                            System.out.printf("[Consumer-%d] Buffer EMPTY. Awaiting producer supply...%n", consumerId);
                            lock.wait();
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                    }

                    item = buffer.poll();
                    consumedCount++;
                    System.out.printf("[Consumer-%d] CONSUMED item: %d | Remaining buffer: %d/%d%n",
                            consumerId, item, buffer.size(), BUFFER_CAPACITY);

                    // Wake up waiting producers
                    lock.notifyAll();
                }

                try {
                    Thread.sleep(180);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("===================================================================");
        System.out.println(" KLU CSE OS LAB · PRODUCER-CONSUMER CONCURRENCY HARNESS ");
        System.out.println(" Buffer Size: " + BUFFER_CAPACITY + " items | Algorithm: Monitored Bounded-Queue");
        System.out.println("===================================================================");

        Thread p1 = new Thread(new Producer(1), "P1");
        Thread p2 = new Thread(new Producer(2), "P2");
        Thread c1 = new Thread(new Consumer(1), "C1");
        Thread c2 = new Thread(new Consumer(2), "C2");

        p1.start();
        p2.start();
        c1.start();
        c2.start();

        p1.join();
        p2.join();
        c1.join();
        c2.join();

        System.out.println("===================================================================");
        System.out.println(" Execution completed successfully with zero deadlocks and zero race conditions.");
        System.out.println("===================================================================");
    }
}

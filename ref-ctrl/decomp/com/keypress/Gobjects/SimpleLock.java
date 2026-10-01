/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

public class SimpleLock {
    private Thread busyFlag = null;
    private int busycount = 0;
    String owner;

    public synchronized void wait_and_get_lock(String whoWantsIt) {
        boolean giveWarning;
        boolean bl = giveWarning = !this.tryToGetLock();
        if (!giveWarning) {
            this.owner = whoWantsIt;
            return;
        }
        while (!this.tryToGetLock()) {
            try {
                this.wait();
            }
            catch (Exception exception) {}
        }
        if (giveWarning) {
            // empty if block
        }
        this.owner = whoWantsIt;
    }

    public synchronized boolean tryToGetLock() {
        if (this.busyFlag == null) {
            this.busyFlag = Thread.currentThread();
            this.busycount = 1;
            return true;
        }
        if (this.busyFlag == Thread.currentThread()) {
            ++this.busycount;
            return true;
        }
        return false;
    }

    public synchronized void release_lock() {
        if (this.busyFlag == Thread.currentThread()) {
            --this.busycount;
        }
        if (this.busycount == 0) {
            this.busyFlag = null;
            this.notify();
        }
    }
}


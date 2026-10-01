/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.PeriodicActionButton;
import com.keypress.Gobjects.Sketch;

class periodicActionThread
extends Thread {
    PeriodicActionButton action;

    public periodicActionThread(PeriodicActionButton theAction) {
        this.action = theAction;
    }

    public void run() {
        boolean keepGoing = true;
        this.action.initializePeriodicAction();
        while (keepGoing) {
            try {
                Thread.sleep(Sketch.FRAMERATE_MILLISECS);
                keepGoing = this.action.periodicAction();
            }
            catch (Exception exception) {}
        }
        this.action.terminatePeriodicAction();
    }
}


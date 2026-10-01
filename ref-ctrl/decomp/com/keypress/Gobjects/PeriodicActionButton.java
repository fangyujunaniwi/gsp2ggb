/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleLock;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gAction;
import com.keypress.Gobjects.periodicActionThread;
import java.awt.Color;
import java.awt.Font;

abstract class PeriodicActionButton
extends gAction {
    periodicActionThread periodicThread;
    Sketch sketch;
    boolean screenUpdaterInitialized = false;
    SimpleLock accessScreenUpdater = new SimpleLock();
    SimpleLock accessClickedDown = new SimpleLock();

    public abstract boolean periodicAction();

    public PeriodicActionButton(GObject[] parents, int numParents, int left, int top, Color backFillColor, String label, Font actionFont) {
        super(parents, numParents, left, top, backFillColor, label, actionFont);
    }

    public void initializePeriodicAction() {
    }

    public synchronized void stopAndRequePendingAction(Sketch theSketch) {
        this.accessClickedDown.wait_and_get_lock("stopAndRequePendingAction/handleClick");
        this.actionIsPending = this.clickedDown;
        if (this.actionIsPending) {
            this.handleClick(theSketch);
        }
        this.accessClickedDown.release_lock();
    }

    public final synchronized void terminatePeriodicAction() {
        this.accessClickedDown.wait_and_get_lock("clickDown/terminator");
        this.clickedDown = false;
        this.accessClickedDown.release_lock();
        this.accessScreenUpdater.wait_and_get_lock("screenUpdater/terminate");
        if (this.screenUpdaterInitialized) {
            this.sketch.RemoveContinuousScreenUpdatingTask();
            this.screenUpdaterInitialized = false;
        }
        this.accessScreenUpdater.release_lock();
    }

    public synchronized void shutDown() {
        this.accessClickedDown.wait_and_get_lock("clickDown/terminator");
        if (this.clickedDown) {
            this.periodicThread.stop();
            this.terminatePeriodicAction();
        }
        this.accessClickedDown.release_lock();
    }

    public synchronized void handleClick(Sketch theSketch) {
        this.accessClickedDown.wait_and_get_lock("clickDown/handleClick");
        if (this.clickedDown) {
            this.periodicThread.stop();
            this.terminatePeriodicAction();
        } else {
            this.sketch = theSketch;
            this.clickedDown = true;
            this.sketch.paint(this.sketch.getGraphics());
            this.periodicThread = new periodicActionThread(this);
            this.periodicThread.start();
        }
        this.accessClickedDown.release_lock();
    }
}


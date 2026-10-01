/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PeriodicActionButton;
import com.keypress.Gobjects.gPoint;
import java.awt.Color;
import java.awt.Font;

public class moveAction
extends PeriodicActionButton {
    private int numMovementPairs;
    private double pixelsPerFrame;
    static final double kLocalTolerance = 0.005;

    public moveAction(int left, int top, String actionLabel, Font myFont, Color backFillColor, GObject[] parents, double pixelsPerFrame) {
        super(parents, parents.length, left, top, backFillColor, actionLabel, myFont);
        this.numMovementPairs = parents.length / 2;
        this.pixelsPerFrame = pixelsPerFrame;
    }

    public synchronized void initializePeriodicAction() {
        this.accessScreenUpdater.wait_and_get_lock("moveInitialize/terminate");
        this.screenUpdaterInitialized = true;
        this.sketch.AddContinuousScreenUpdatingTask();
        this.accessScreenUpdater.release_lock();
    }

    public synchronized boolean periodicAction() {
        boolean done = true;
        this.sketch.getGObjectsLock().wait_and_get_lock("move/periodicAction");
        try {
            for (int i = 0; i < this.numMovementPairs; ++i) {
                gPoint dest = (gPoint)this.getParent(i * 2);
                gPoint source = (gPoint)this.getParent(i * 2 + 1);
                if (!source.isExisting()) continue;
                if (dest.isExisting()) {
                    double sourceX = source.getX();
                    double sourceY = source.getY();
                    if (dest.getX() == sourceX && dest.getY() == sourceY) continue;
                    ((Draggable)((Object)source)).dragToward(dest.getX(), dest.getY(), this.pixelsPerFrame);
                    if (sourceX == source.getX() && sourceY == source.getY() && Math.abs(sourceX - dest.getX()) < 0.005 && Math.abs(sourceY - dest.getY()) < 0.005) continue;
                    done = false;
                    continue;
                }
                done = false;
            }
        }
        catch (Exception e) {
            done = true;
        }
        this.sketch.getGObjectsLock().release_lock();
        return !done;
    }

    public void modifySpeed(double percentage) {
        boolean wasZero = this.pixelsPerFrame == 0.0;
        this.pixelsPerFrame *= percentage;
        if (this.pixelsPerFrame == 0.0 && !wasZero) {
            this.pixelsPerFrame = Double.MIN_VALUE;
        }
        this.accessClickedDown.wait_and_get_lock("modifySpeed");
        if (this.clickedDown) {
            this.terminatePeriodicAction();
            this.initializePeriodicAction();
        }
        this.accessClickedDown.release_lock();
    }
}


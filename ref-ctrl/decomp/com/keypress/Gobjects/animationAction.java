/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Path;
import com.keypress.Gobjects.PeriodicActionButton;
import com.keypress.Gobjects.gPoint;
import java.awt.Color;
import java.awt.Font;

public class animationAction
extends PeriodicActionButton {
    private int numAnimatedPoints;
    private AnimatedPoint[] pairs;
    private boolean[] pairsActive;

    public animationAction(int left, int top, String actionLabel, Font myFont, Color backFillColor, GObject[] parents, double[] speeds, boolean[] onceOnly, boolean[] direction) {
        super(parents, parents.length, left, top, backFillColor, actionLabel, myFont);
        this.numAnimatedPoints = parents.length / 2;
        this.pairs = new AnimatedPoint[this.numAnimatedPoints];
        this.pairsActive = new boolean[this.numAnimatedPoints];
        for (int i = 0; i < this.numAnimatedPoints; ++i) {
            this.pairs[i] = ((Path)((Object)parents[i * 2 + 1])).CreateAnimatedPoint((gPoint)parents[i * 2], (Path)((Object)parents[i * 2 + 1]), speeds[i], onceOnly[i], direction[i]);
        }
    }

    public void modifySpeed(double percentage) {
        for (int i = 0; i < this.numAnimatedPoints; ++i) {
            this.pairs[i].modifySpeed(percentage);
        }
    }

    public synchronized void initializePeriodicAction() {
        this.sketch.getGObjectsLock().wait_and_get_lock("animate/initializePeriodicAction");
        for (int i = 0; i < this.numAnimatedPoints; ++i) {
            if (this.pairs[i].animationIsDefined()) {
                this.pairsActive[i] = true;
                this.pairs[i].setupAnimatingPoint();
                continue;
            }
            this.pairsActive[i] = false;
        }
        this.sketch.getGObjectsLock().release_lock();
        this.accessScreenUpdater.wait_and_get_lock("animScreenUpdate/initialize");
        this.screenUpdaterInitialized = true;
        this.sketch.AddContinuousScreenUpdatingTask();
        this.accessScreenUpdater.release_lock();
    }

    public synchronized boolean periodicAction() {
        boolean done = false;
        boolean anyActive = false;
        this.sketch.getGObjectsLock().wait_and_get_lock("(gobjs) Animate/periodicAction");
        for (int i = 0; i < this.numAnimatedPoints; ++i) {
            if (!this.pairsActive[i]) continue;
            if (this.pairs[i].animationIsDefined()) {
                anyActive = true;
                if (!this.pairs[i].animatePoint()) continue;
                done = true;
                continue;
            }
            this.pairsActive[i] = false;
        }
        this.sketch.getGObjectsLock().release_lock();
        if (!done) {
            done = !anyActive;
        }
        return !done;
    }
}


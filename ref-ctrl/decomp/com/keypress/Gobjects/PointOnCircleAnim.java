/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.gPoint;

class PointOnCircleAnim
extends AnimatedPoint {
    gCircle path;
    double radialLoc;
    double radialDelta;
    double storedRadius;
    double stopAfterRadius;
    boolean movingClockwise;
    boolean stalled;

    final GObject getPath() {
        return this.path;
    }

    public PointOnCircleAnim(gPoint thePoint, gCircle thePath, double initialSpeed, boolean onceOnly, boolean clockwise) {
        super(thePoint, onceOnly, initialSpeed);
        this.path = thePath;
        this.movingClockwise = clockwise;
    }

    private void updateFromNewCircle() {
        this.storedRadius = this.path.getPixelRadius();
        this.radialDelta = this.pixelsPerFrame / this.storedRadius;
        if (this.movingClockwise) {
            this.radialDelta = -this.radialDelta;
        }
    }

    private void advanceMover() {
        ((Draggable)((Object)this.mover)).dragTo(this.path.getCenterX() + Math.cos(this.radialLoc) * this.storedRadius, this.path.getCenterY() + Math.sin(this.radialLoc) * this.storedRadius, false);
    }

    public void setupAnimatingPoint() {
        this.updateFromNewCircle();
        double x = this.mover.getX() - this.path.getCenterX();
        double y = this.mover.getY() - this.path.getCenterY();
        this.radialLoc = x == 0.0 && y == 0.0 ? 0.0 : Math.atan2(y, x);
        if (this.onceOnly) {
            this.stopAfterRadius = this.movingClockwise ? this.radialLoc - Math.PI * 2 : this.radialLoc + Math.PI * 2;
        }
        this.advanceMover();
    }

    public boolean animatePoint() {
        if (this.storedRadius != this.path.getPixelRadius()) {
            this.updateFromNewCircle();
        }
        this.radialLoc += this.radialDelta;
        this.advanceMover();
        boolean stopped = this.onceOnly ? (this.movingClockwise ? this.radialLoc <= this.stopAfterRadius : this.radialLoc >= this.stopAfterRadius) : false;
        return stopped;
    }

    public void modifySpeed(double percentage) {
        this.pixelsPerFrame *= percentage;
        if (this.pixelsPerFrame == 0.0) {
            this.pixelsPerFrame = Double.MIN_VALUE;
        }
        if (this.animationIsDefined()) {
            this.updateFromNewCircle();
        }
    }
}


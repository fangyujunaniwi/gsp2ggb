/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

class PointOnStraightAnim
extends AnimatedPoint {
    gStraight path;
    double fractionDelta;
    double curFraction;
    double storedDistanceSquare;
    double stopAfterFraction;
    double lowEnd;
    double highEnd;
    boolean oneWay;
    boolean hasBounced;

    final GObject getPath() {
        return this.path;
    }

    public PointOnStraightAnim(gPoint thePoint, gStraight thePath, double initialSpeed, boolean onceOnly, boolean oneWay) {
        super(thePoint, onceOnly, initialSpeed);
        this.path = thePath;
        this.oneWay = onceOnly ? true : oneWay;
    }

    private void updateFromNewStraight(boolean forward) {
        double dx = this.path.getdX();
        double dy = this.path.getdY();
        this.storedDistanceSquare = dx * dx + dy * dy;
        double curDistance = Math.sqrt(this.storedDistanceSquare);
        this.fractionDelta = this.pixelsPerFrame / curDistance;
        if (!forward) {
            this.fractionDelta = -this.fractionDelta;
        }
        this.curFraction = Math.abs(dx) > Math.abs(dy) ? (this.mover.getX() - this.path.x1) / dx : (this.mover.getY() - this.path.y1) / dy;
    }

    private void advanceMover() {
        ((Draggable)((Object)this.mover)).dragTo(this.path.x1 + this.curFraction * this.path.getdX(), this.path.y1 + this.curFraction * this.path.getdY(), false);
    }

    public void setupAnimatingPoint() {
        this.updateFromNewStraight(true);
        this.lowEnd = 0.0;
        this.highEnd = 1.0;
        this.advanceMover();
        if (this.onceOnly) {
            this.stopAfterFraction = this.curFraction;
            this.hasBounced = false;
        }
    }

    public boolean animatePoint() {
        if (this.storedDistanceSquare != this.path.getdX() * this.path.getdX() + this.path.getdY() * this.path.getdY()) {
            this.updateFromNewStraight(this.fractionDelta > 0.0);
        }
        this.curFraction += this.fractionDelta;
        if (this.hasBounced && this.onceOnly && this.curFraction > this.stopAfterFraction) {
            return true;
        }
        if (this.curFraction > this.highEnd) {
            this.fractionDelta = -this.fractionDelta;
            this.hasBounced = true;
            this.curFraction = this.oneWay ? this.lowEnd : this.highEnd;
        } else if (this.curFraction <= this.lowEnd) {
            this.fractionDelta = -this.fractionDelta;
            this.curFraction = this.lowEnd;
        }
        this.advanceMover();
        return false;
    }

    public void modifySpeed(double percentage) {
        this.pixelsPerFrame *= percentage;
        if (this.pixelsPerFrame == 0.0) {
            this.pixelsPerFrame = Double.MIN_VALUE;
        }
        if (this.animationIsDefined()) {
            this.updateFromNewStraight(this.fractionDelta > 0.0);
        }
    }
}


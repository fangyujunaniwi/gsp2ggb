/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PointOnSamplerCurve;
import com.keypress.Gobjects.QualifiedPoint;
import com.keypress.Gobjects.SamplerCurve;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.pathWalk;

public class PointOnSamplerCurveAnim
extends AnimatedPoint {
    SamplerCurve path;
    boolean oneWay;
    double fractionDelta;
    double curFraction;
    double stopAfterFraction;
    boolean hasBounced;
    long cachedPathConstraintStability;

    final GObject getPath() {
        return this.path;
    }

    public PointOnSamplerCurveAnim(gPoint thePoint, SamplerCurve thePath, double initialSpeed, boolean onceOnly, boolean oneWay) {
        super(thePoint, onceOnly, initialSpeed);
        this.path = thePath;
        if (onceOnly) {
            this.oneWay = true;
        }
        this.oneWay = oneWay;
    }

    private void updateFromNewCurve(boolean forward) {
        double curLength = this.path.getApproximateLength();
        if (0.0 == curLength) {
            curLength = 1.0;
        }
        this.fractionDelta = this.pixelsPerFrame / curLength;
        if (!forward) {
            this.fractionDelta = -this.fractionDelta;
        }
        this.cachedPathConstraintStability = this.path.getConstraintStability();
    }

    private void advanceMover() {
        pathWalk a = new pathWalk();
        boolean exists = this.path.getPointOnPath(a, this.curFraction);
        ((PointOnSamplerCurve)this.mover).animateTo(a.sampleX, a.sampleY, this.curFraction, exists);
    }

    public void setupAnimatingPoint() {
        this.updateFromNewCurve(true);
        this.curFraction = 0.0;
        if (this.mover.isExisting()) {
            QualifiedPoint closestPoint = new QualifiedPoint(this.mover.getX(), this.mover.getY());
            this.path.getNearestPointOnCurve(closestPoint);
            if (closestPoint.exists) {
                this.curFraction = closestPoint.parameter;
            }
        }
        this.advanceMover();
        if (this.onceOnly) {
            this.stopAfterFraction = this.curFraction;
            this.hasBounced = false;
        }
    }

    public boolean animatePoint() {
        if (this.path.getConstraintStability() != this.cachedPathConstraintStability) {
            this.updateFromNewCurve(this.fractionDelta > 0.0);
        }
        this.curFraction += this.fractionDelta;
        if (this.hasBounced && this.onceOnly && this.curFraction > this.stopAfterFraction) {
            return true;
        }
        if (this.curFraction > 1.0) {
            this.fractionDelta = -this.fractionDelta;
            this.hasBounced = true;
            this.curFraction = this.oneWay ? 0.0 : 1.0;
        } else if (this.curFraction <= 0.0) {
            this.fractionDelta = -this.fractionDelta;
            this.curFraction = 0.0;
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
            this.updateFromNewCurve(this.fractionDelta > 0.0);
        }
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PointOnPolygon;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gPolygon;

class PointOnPolygonAnim
extends AnimatedPoint {
    gPolygon path;
    double initFraction;
    double fractionDelta;
    boolean clockwise;
    int windingNumber;

    public PointOnPolygonAnim(gPoint thePoint, gPolygon thePath, double initialSpeed, boolean onceOnly, boolean Clockwise) {
        super(thePoint, onceOnly, initialSpeed);
        this.path = thePath;
        this.clockwise = Clockwise;
    }

    GObject getPath() {
        return this.path;
    }

    final int getVertexCount() {
        return this.path.VertexX.length;
    }

    void RecomputeParameters() {
        this.windingNumber = 0;
    }

    double getCurrentFraction() {
        return ((PointOnPolygon)this.mover).getOffset();
    }

    void setupAnimatingPoint() {
        this.RecomputeParameters();
        this.initFraction = this.getCurrentFraction();
    }

    double getCurrentDelta() {
        double tCurFraction = this.getCurrentFraction();
        int Point0 = (int)tCurFraction;
        int Point1 = Point0 + 1;
        if (Point1 == this.getVertexCount()) {
            Point1 = 0;
        }
        double X0 = this.path.VertexX[Point0];
        double Y0 = this.path.VertexY[Point0];
        double X1 = this.path.VertexX[Point1];
        double Y1 = this.path.VertexY[Point1];
        double PixFactor = Math.max(Math.abs(X1 - X0), Math.abs(Y1 - Y0));
        if (PixFactor == 0.0) {
            return 1.0;
        }
        return this.pixelsPerFrame / PixFactor;
    }

    boolean animatePoint() {
        int Point0;
        int Point1;
        double tCurFraction = this.getCurrentFraction();
        int tVertexCount = this.getVertexCount();
        this.fractionDelta = this.getCurrentDelta();
        if (this.fractionDelta > 1.0) {
            this.fractionDelta = 1.0;
        }
        if (!this.clockwise) {
            this.fractionDelta = -this.fractionDelta;
        }
        if ((tCurFraction += this.fractionDelta) >= (double)tVertexCount) {
            tCurFraction -= (double)tVertexCount;
            this.windingNumber += tVertexCount;
        }
        if (tCurFraction < 0.0) {
            tCurFraction += (double)tVertexCount;
            this.windingNumber -= tVertexCount;
        }
        if ((Point1 = (Point0 = (int)tCurFraction) + 1) == tVertexCount) {
            Point1 = 0;
        }
        double lam = tCurFraction - (double)Point0;
        double X0 = this.path.VertexX[Point0];
        double Y0 = this.path.VertexY[Point0];
        double X1 = this.path.VertexX[Point1];
        double Y1 = this.path.VertexY[Point1];
        double newX = lam * (X1 - X0) + X0;
        double newY = lam * (Y1 - Y0) + Y0;
        this.mover.x = newX;
        this.mover.y = newY;
        ((PointOnPolygon)this.mover).setOffset(tCurFraction);
        ((Draggable)((Object)this.mover)).getAffectedDescendents().constrainDescendents(false);
        return this.onceOnly && Math.abs(tCurFraction + (double)this.windingNumber - this.initFraction) >= (double)tVertexCount;
    }

    void modifySpeed(double percentage) {
        this.pixelsPerFrame *= percentage;
        if (this.pixelsPerFrame == 0.0) {
            this.pixelsPerFrame = Double.MIN_VALUE;
        }
    }
}


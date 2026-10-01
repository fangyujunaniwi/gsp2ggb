/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AffectedDescendents;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;

public abstract class PointOnObject
extends gPoint
implements Draggable {
    AffectedDescendents affected = new AffectedDescendents();

    public PointOnObject(GObject host) {
        super(1);
        this.AssignParent(0, host);
        this.setColor(gPoint._defaultFreePointColor);
    }

    public final AffectedDescendents getAffectedDescendents() {
        return this.affected;
    }

    public boolean isDraggable() {
        return true;
    }

    abstract void mapPointToHost();

    public void dragTo(double x, double y, boolean locusDriving) {
        this.x = x;
        this.y = y;
        this.mapPointToHost();
        this.affected.constrainDescendents(locusDriving);
    }

    public void dragToward(double iTowardX, double iTowardY, double iMaxPixelsToMove) {
        double straightLineY;
        double straightLineX;
        double originalX = this.x;
        double originalY = this.y;
        double dx = iTowardX - this.x;
        double dy = iTowardY - this.y;
        double distToDest = dx * dx + dy * dy;
        if (distToDest <= iMaxPixelsToMove * iMaxPixelsToMove) {
            straightLineX = iTowardX;
            straightLineY = iTowardY;
        } else {
            double theRatio = iMaxPixelsToMove / Math.sqrt(distToDest);
            straightLineX = originalX + dx * theRatio;
            straightLineY = originalY + dy * theRatio;
        }
        this.x = straightLineX;
        this.y = straightLineY;
        this.mapPointToHost();
        if (this.x == originalX && this.y == originalY && (this.x != iTowardX || this.y != iTowardY)) {
            double randomAngle = Math.PI * 2 * Math.random();
            this.x += iMaxPixelsToMove * Math.cos(randomAngle);
            this.y += iMaxPixelsToMove * Math.sin(randomAngle);
            this.mapPointToHost();
            dx = iTowardX - this.x;
            dy = iTowardY - this.y;
            double newDistanceToDest = dx * dx + dy * dy;
            if (newDistanceToDest > distToDest) {
                this.x = originalX;
                this.y = originalY;
                this.mapPointToHost();
            }
        }
        this.affected.constrainDescendents(false);
    }
}


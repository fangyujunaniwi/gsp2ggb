/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Path;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gPointLocus;
import com.keypress.Gobjects.gStraight;
import com.keypress.Gobjects.gStraightLocus;
import com.keypress.Gobjects.pathWalk;
import java.awt.Color;

public abstract class Sampler
extends GObject {
    boolean evaluatingSelf = false;
    int numSamples = 0;
    boolean[] sampleExists;
    long samplerConstraintStability = 0L;
    boolean samplesAreColorized = false;
    Color[] sampleColor;

    public Sampler(GObject movePoint, GObject movePath, GObject traceGObj, int numSamples) {
        super(3);
        this.AssignParent(0, movePoint);
        this.AssignParent(1, movePath);
        this.AssignParent(2, traceGObj);
        this.numSamples = numSamples;
        this.setColor(traceGObj.getColor().darker().darker());
        if (traceGObj.isColorized()) {
            this.samplesAreColorized = true;
            this.sampleColor = new Color[numSamples];
        }
        this.sampleExists = new boolean[numSamples];
    }

    public Sampler(GObject myFunction, GObject myCoordSys, int numSamples) {
        super(2);
        this.AssignParent(0, myFunction);
        this.AssignParent(1, myCoordSys);
        this.numSamples = numSamples;
        this.sampleExists = new boolean[numSamples];
    }

    public String toString() {
        if (this.getNumParents() == 3) {
            return "Locus of " + this.getParent(2) + " as " + this.getParent(0) + " moves";
        }
        return "Function plot of " + this.getParent(0) + " on coordinate system " + this.getParent(1);
    }

    public int getGenera() {
        return 8;
    }

    public long getConstraintStability() {
        return this.samplerConstraintStability;
    }

    final int PrintSortOrder() {
        return 4000;
    }

    abstract void recordSample(GObject var1, int var2);

    public void Constrain(boolean locusDriving) {
        if (this.evaluatingSelf) {
            return;
        }
        if (locusDriving) {
            return;
        }
        this.evaluatingSelf = true;
        gPoint movePoint = (gPoint)this.getParent(0);
        Path movePath = (Path)((Object)this.getParent(1));
        GObject traceGObj = this.getParent(2);
        ++this.samplerConstraintStability;
        this.existing = ((GObject)((Object)movePath)).isExisting();
        if (this.existing) {
            double oldMoveX = movePoint.getX();
            double oldMoveY = movePoint.getY();
            Draggable mover = (Draggable)((Object)movePoint);
            pathWalk p = movePath.preparePathWalk(this.numSamples);
            this.existing = false;
            for (int i = 0; i < this.numSamples; ++i) {
                boolean thisSampleExists = movePath.walkPath(p, i);
                if (thisSampleExists) {
                    mover.dragTo(p.sampleX, p.sampleY, true);
                    thisSampleExists = traceGObj.isExisting();
                }
                if (thisSampleExists) {
                    this.existing = true;
                    this.sampleExists[i] = true;
                    this.recordSample(traceGObj, i);
                    if (!this.samplesAreColorized) continue;
                    this.sampleColor[i] = traceGObj.getColor();
                    continue;
                }
                this.sampleExists[i] = false;
            }
            mover.dragTo(oldMoveX, oldMoveY, true);
        }
        this.evaluatingSelf = false;
    }

    public static final GObject constructLocus(GObject movePoint, GObject movePath, GObject traceGObj, int numSamples) {
        if (traceGObj instanceof gPoint) {
            return new gPointLocus(movePoint, movePath, traceGObj, numSamples);
        }
        if (traceGObj instanceof gStraight) {
            return new gStraightLocus(movePoint, movePath, traceGObj, numSamples);
        }
        System.out.print("This release of JSP cannot compute the locus of " + traceGObj + "\r\n");
        return null;
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Path;
import com.keypress.Gobjects.SamplerCurve;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.pathWalk;

public class gPointLocus
extends SamplerCurve {
    public gPointLocus(GObject movePoint, GObject movePath, GObject traceGObj, int numSamples) {
        super(movePoint, movePath, traceGObj, numSamples);
        if (((Path)((Object)movePath)).pathIsClosed()) {
            this.isClosed = true;
        }
    }

    void recordSample(GObject traceGObj, int sample) {
        gPoint tracer = (gPoint)traceGObj;
        this.sampleX[sample] = tracer.getX();
        this.sampleY[sample] = tracer.getY();
    }

    public boolean getPointOnPath(pathWalk oReturn, double iFraction) {
        boolean ret = false;
        gPoint movePoint = (gPoint)this.getParent(0);
        Path movePath = (Path)((Object)this.getParent(1));
        gPoint tracePoint = (gPoint)this.getParent(2);
        if (((GObject)((Object)movePath)).isExisting() && movePath.getPointOnPath(oReturn, iFraction)) {
            double oldMoveX = movePoint.getX();
            double oldMoveY = movePoint.getY();
            Draggable mover = (Draggable)((Object)movePoint);
            mover.dragTo(oReturn.sampleX, oReturn.sampleY, true);
            ret = tracePoint.isExisting();
            if (ret) {
                oReturn.sampleX = tracePoint.getX();
                oReturn.sampleY = tracePoint.getY();
            }
            mover.dragTo(oldMoveX, oldMoveY, true);
        }
        return ret;
    }
}


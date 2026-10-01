/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PointOnObject;
import com.keypress.Gobjects.QualifiedPoint;
import com.keypress.Gobjects.SamplerCurve;

public class PointOnSamplerCurve
extends PointOnObject {
    private double relativeLocation;

    public PointOnSamplerCurve(GObject host, double relativeLocation) {
        super(host);
        this.relativeLocation = relativeLocation;
    }

    void mapPointToHost() {
        SamplerCurve host = (SamplerCurve)this.getParent(0);
        QualifiedPoint nearestPoint = new QualifiedPoint(this.x, this.y);
        host.getNearestPointOnCurve(nearestPoint);
        this.existing = nearestPoint.exists;
        if (this.existing) {
            this.x = nearestPoint.x;
            this.y = nearestPoint.y;
            this.relativeLocation = nearestPoint.parameter;
        }
    }

    public void animateTo(double xOnPath, double yOnPath, double relativeLocationOnPath, boolean existing) {
        this.x = xOnPath;
        this.y = yOnPath;
        this.relativeLocation = relativeLocationOnPath;
        this.existing = existing;
        this.getAffectedDescendents().constrainDescendents(false);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            SamplerCurve host = (SamplerCurve)this.getParent(0);
            int index = (int)(this.relativeLocation * (double)host.numSamples);
            if (index == host.numSamples) {
                --index;
            }
            if (host.getSampleExists(index)) {
                this.x = host.getSampleX(index);
                this.y = host.getSampleY(index);
            } else {
                this.existing = false;
            }
        }
    }
}


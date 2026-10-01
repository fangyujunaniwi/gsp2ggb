/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gPolygon;

public class PolygonByVertices
extends gPolygon {
    public PolygonByVertices(GObject[] parents) {
        super(parents, parents.length);
    }

    public void Constrain(boolean locusDriving) {
        int numVertices = this.getNumParents();
        this.invalidatePolygonMetrics();
        this.existing = this.parentsExisting();
        if (this.existing) {
            for (int i = 0; i < numVertices; ++i) {
                gPoint par = (gPoint)this.getParent(i);
                this.VertexY[i] = par.getY();
                this.iVertexY[i] = (int)Math.round(this.VertexY[i]);
                this.VertexX[i] = par.getX();
                this.iVertexX[i] = (int)Math.round(this.VertexX[i]);
            }
        }
    }
}


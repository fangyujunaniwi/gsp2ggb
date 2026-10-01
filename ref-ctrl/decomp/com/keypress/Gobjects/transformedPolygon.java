/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;
import com.keypress.Gobjects.gPolygon;

public class transformedPolygon
extends gPolygon {
    Transformer transform;

    public transformedPolygon(GObject[] theParents, Transformer myTransformer) {
        super(theParents, ((gPolygon)theParents[0]).iVertexX.length);
        this.transform = myTransformer;
    }

    public boolean isColorized() {
        return this.transform.imageIsColorized();
    }

    public void Constrain(boolean locusDriving) {
        this.invalidatePolygonMetrics();
        boolean bl = this.existing = this.parentsExisting() && this.transform.prepareTransformer(this);
        if (this.existing) {
            gPolygon preImage = (gPolygon)this.getParent(0);
            int numVertices = preImage.iVertexX.length;
            doublePoint imageVertex = new doublePoint();
            for (int i = 0; i < numVertices; ++i) {
                imageVertex = this.transform.imageXY(preImage.VertexX[i], preImage.VertexY[i]);
                this.VertexX[i] = imageVertex.x;
                this.iVertexX[i] = (int)Math.round(this.VertexX[i]);
                this.VertexY[i] = imageVertex.y;
                this.iVertexY[i] = (int)Math.round(this.VertexY[i]);
            }
        }
    }
}


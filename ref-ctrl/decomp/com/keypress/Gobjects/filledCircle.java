/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.transformedFilledCircle;
import java.awt.Graphics;

public abstract class filledCircle
extends gCircle {
    public filledCircle(int numParents) {
        super(numParents);
    }

    final int PrintSortOrder() {
        return 1000;
    }

    public void DrawVisible(Graphics g) {
        g.setColor(this.color);
        g.fillOval(this.boundsLeft, this.boundsTop, this.boundsExtent, this.boundsExtent);
    }

    public GObject createTransformedImage(GObject[] parents, Transformer myTransform) {
        return new transformedFilledCircle(parents, myTransform);
    }
}


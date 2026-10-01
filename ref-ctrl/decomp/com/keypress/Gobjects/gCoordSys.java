/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;

public abstract class gCoordSys
extends GObject {
    static final int MIN_TICK_SPACING = 8;
    double originX;
    double originY;
    double unitLengthX;
    double unitLengthY;
    Sketch ownerSketch;

    final int PrintSortOrder() {
        return 3000;
    }

    public final int getGenera() {
        return 7;
    }

    final double getOriginX() {
        return this.originX;
    }

    final double getOriginY() {
        return this.originY;
    }

    final double getUnitLengthX() {
        return this.unitLengthX;
    }

    final double getUnitLengthY() {
        return this.unitLengthY;
    }

    public void DrawVisible(Graphics g) {
        double metaUnitLengthX = this.getUnitLengthX();
        if (metaUnitLengthX <= 0.0) {
            metaUnitLengthX = 8.0;
        }
        while (metaUnitLengthX < 8.0) {
            metaUnitLengthX *= 10.0;
        }
        double metaUnitLengthY = this.getUnitLengthY();
        if (metaUnitLengthY <= 0.0) {
            metaUnitLengthY = 8.0;
        }
        while (metaUnitLengthY < 8.0) {
            metaUnitLengthY *= 10.0;
        }
        Dimension draw = this.ownerSketch.size();
        int xl = (int)(0.0 - this.originX / metaUnitLengthX);
        int yt = (int)(0.0 - this.originY / metaUnitLengthY);
        int xr = (int)(((double)draw.width - this.originX) / metaUnitLengthX);
        int yb = (int)(((double)draw.height - this.originY) / metaUnitLengthY);
        g.setColor(this.color);
        double X = this.originX + metaUnitLengthX * (double)xl;
        while (xl++ <= xr) {
            int iX = (int)Math.round(X);
            g.drawLine(iX, 0, iX, draw.height);
            X += metaUnitLengthX;
        }
        double Y = this.originY + metaUnitLengthY * (double)yt;
        while (yt++ <= yb) {
            int iY = (int)Math.round(Y);
            g.drawLine(0, iY, draw.width, iY);
            Y += metaUnitLengthY;
        }
    }

    public gCoordSys(int numParents, Sketch theSketch) {
        super(numParents);
        this.ownerSketch = theSketch;
        this.setColor(Color.black);
    }
}


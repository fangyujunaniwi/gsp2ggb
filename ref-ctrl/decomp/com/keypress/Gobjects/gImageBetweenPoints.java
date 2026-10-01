/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gImage;
import com.keypress.Gobjects.gPoint;
import java.awt.Component;
import java.awt.Graphics;
import java.awt.Image;

public class gImageBetweenPoints
extends gImage {
    int width;
    int height;

    public gImageBetweenPoints(GObject corner1, GObject corner2, Image theImage, Component dest) {
        super(2, 0, 0, theImage, dest);
        this.AssignParent(0, corner1);
        this.AssignParent(1, corner2);
    }

    int PrintSortOrder() {
        return 2000;
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing && !locusDriving) {
            gPoint corner1 = (gPoint)this.getParent(0);
            gPoint corner2 = (gPoint)this.getParent(1);
            int x1 = (int)(0.5 + corner1.getX());
            int y1 = (int)(0.5 + corner1.getY());
            int x2 = (int)(0.5 + corner2.getX());
            int y2 = (int)(0.5 + corner2.getY());
            if (x1 < x2) {
                this.baseX = x1;
                this.width = x2 - x1;
            } else {
                this.baseX = x2;
                this.width = x1 - x2;
            }
            if (y1 < y2) {
                this.baseY = y1;
                this.height = y2 - y1;
            } else {
                this.baseY = y2;
                this.height = y1 - y2;
            }
        }
    }

    public void DrawVisible(Graphics g) {
        if (g != null) {
            g.drawImage(this.theImage, this.baseX, this.baseY, this.width, this.height, this.destination);
        }
    }
}


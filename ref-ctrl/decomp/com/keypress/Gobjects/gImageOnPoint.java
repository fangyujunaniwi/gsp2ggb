/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gImage;
import com.keypress.Gobjects.gPoint;
import java.awt.Component;
import java.awt.Image;

public class gImageOnPoint
extends gImage {
    public gImageOnPoint(GObject upperLeftPoint, Image theImage, Component dest) {
        super(1, 0, 0, theImage, dest);
        this.AssignParent(0, upperLeftPoint);
    }

    int PrintSortOrder() {
        return 2000;
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing && !locusDriving) {
            gPoint upperLeft = (gPoint)this.getParent(0);
            this.baseX = (int)(0.5 + upperLeft.getX());
            this.baseY = (int)(0.5 + upperLeft.getY());
        }
    }
}


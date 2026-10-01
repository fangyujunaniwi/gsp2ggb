/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import java.awt.Component;
import java.awt.Graphics;
import java.awt.Image;

public class gImage
extends GObject {
    int baseX = 0;
    int baseY = 0;
    Image theImage;
    Component destination;

    public gImage(int numParents, int baseX, int baseY, Image theImage, Component dest) {
        super(numParents);
        this.baseY = baseY;
        this.baseX = baseX;
        this.theImage = theImage;
        this.destination = dest;
    }

    public int getGenera() {
        return 3;
    }

    public void DrawVisible(Graphics g) {
        if (g != null) {
            g.drawImage(this.theImage, this.baseX, this.baseY, this.destination);
        }
    }

    int PrintSortOrder() {
        return 0;
    }

    public void Constrain(boolean locusDriving) {
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;

public class gText
extends GObject {
    int baseX = 0;
    int baseY = 0;
    String msg;
    int justification;
    public static final int _flushLeft = 0;
    public static final int _flushRight = 1;
    public static final int _justifyCenter = 2;

    public gText(Font myFont, int numParents, GObject[] parents, int baseX, int baseY, String theText) {
        super(numParents);
        this.color = Color.black;
        if (0 != numParents) {
            this.AssignParents(parents);
        }
        this.baseY = baseY;
        this.baseX = baseX;
        this.msg = theText;
        this.justification = 0;
        this.setLabel("", myFont);
    }

    public int getGenera() {
        return 5;
    }

    public void DrawVisible(Graphics g) {
        int x = this.baseX;
        int y = this.baseY;
        g.setColor(this.color);
        g.setFont(this.myLabelFont);
        if (0 != this.justification) {
            FontMetrics pm = g.getFontMetrics(this.myLabelFont);
            int width = pm.stringWidth(this.msg);
            x = 1 == this.justification ? (x -= width) : (x -= width / 2);
        }
        g.drawString(this.msg, x, y);
    }

    public void setTextJustification(int newJustification) {
        this.justification = newJustification;
    }

    final int PrintSortOrder() {
        return 5000;
    }

    public void Constrain(boolean locusDriving) {
    }
}


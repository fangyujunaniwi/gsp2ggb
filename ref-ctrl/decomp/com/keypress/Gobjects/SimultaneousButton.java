/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gAction;
import java.awt.Color;
import java.awt.Font;

public class SimultaneousButton
extends gAction {
    public SimultaneousButton(int left, int top, String actionLabel, Font myFont, Color backFillColor, GObject[] parents) {
        super(parents, parents.length, left, top, backFillColor, actionLabel, myFont);
    }

    public void handleClick(Sketch aSketch) {
        this.clickedDown = true;
        aSketch.paint(aSketch.getGraphics());
        int j = this.getNumParents();
        for (int i = 0; i < j; ++i) {
            this.getParent(i).handleClick(aSketch);
        }
        this.clickedDown = false;
        aSketch.paint(aSketch.getGraphics());
    }
}


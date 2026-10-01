/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.ToggleVisibilityButton;
import com.keypress.Gobjects.gAction;
import java.awt.Color;
import java.awt.Font;

public class VisibilityButton
extends gAction {
    boolean willHideObjects;

    public VisibilityButton(int left, int top, String actionLabel, Font myFont, Color backFillColor, GObject[] parents, boolean willHideObjects) {
        super(parents, parents.length, left, top, backFillColor, actionLabel, myFont);
        this.willHideObjects = willHideObjects;
    }

    public void handleClick(Sketch aSketch) {
        int i;
        this.clickedDown = true;
        aSketch.paint(aSketch.getGraphics());
        int j = this.getNumParents();
        for (i = 0; i < j; ++i) {
            this.getParent(i).setHidden(this.willHideObjects);
        }
        for (i = 0; i < j; ++i) {
            VisibilityButton.checkTVBStates(this.getParent(i));
        }
        this.clickedDown = false;
        aSketch.paint(aSketch.getGraphics());
    }

    public static void checkTVBStates(GObject thisParent) {
        for (int j = 0; j < thisParent.getNumChildren(); ++j) {
            boolean parentsPartiallyShowing;
            GObject thisChild = thisParent.getChild(j);
            if (!(thisChild instanceof ToggleVisibilityButton)) continue;
            ToggleVisibilityButton thisButtonChild = (ToggleVisibilityButton)thisChild;
            boolean changeMe = parentsPartiallyShowing = thisButtonChild.willHideObjects;
            for (int n = 0; n < thisButtonChild.getNumParents(); ++n) {
                if (thisButtonChild.getParent(n).isHidden()) continue;
                changeMe = !parentsPartiallyShowing;
                break;
            }
            if (!changeMe) continue;
            thisButtonChild.willHideObjects = !thisButtonChild.willHideObjects;
            thisButtonChild.setupNextLabel();
        }
    }
}


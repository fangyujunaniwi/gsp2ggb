/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.VisibilityButton;
import java.awt.Color;
import java.awt.Font;

public class ToggleVisibilityButton
extends VisibilityButton {
    String hideLabel = null;
    String showLabel = null;

    public ToggleVisibilityButton(int left, int top, String actionLabel, Font myFont, Color backFillColor, GObject[] parents) {
        super(left, top, actionLabel, myFont, backFillColor, parents, false);
        int barLocation = actionLabel.indexOf(124);
        this.setLabel("", myFont);
        if (barLocation != -1) {
            this.hideLabel = actionLabel.substring(0, barLocation);
            this.showLabel = actionLabel.substring(barLocation + 1, actionLabel.length());
        } else {
            this.hideLabel = actionLabel;
            this.showLabel = actionLabel;
        }
        for (int i = 0; i < parents.length; ++i) {
            if (parents[i].isHidden()) continue;
            this.willHideObjects = true;
            break;
        }
        this.setupNextLabel();
    }

    public String toString() {
        if (this.hideLabel == null && this.showLabel == null) {
            return "TVB button: " + this.getLabel();
        }
        return "TVB button: " + this.hideLabel + " | " + this.showLabel;
    }

    void setupNextLabel() {
        if (this.willHideObjects && this.hideLabel != null) {
            this.setLabel(this.hideLabel, this.myLabelFont);
        } else if (!this.willHideObjects && this.showLabel != null) {
            this.setLabel(this.showLabel, this.myLabelFont);
        }
        this.metricsUninitialized = true;
    }
}


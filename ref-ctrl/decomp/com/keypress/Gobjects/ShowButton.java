/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.VisibilityButton;
import java.awt.Color;
import java.awt.Font;

public class ShowButton
extends VisibilityButton {
    public ShowButton(int left, int top, String actionLabel, Font myFont, Color backFillColor, GObject[] parents) {
        super(left, top, actionLabel, myFont, backFillColor, parents, false);
    }
}


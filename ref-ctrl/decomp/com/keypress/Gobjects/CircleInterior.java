/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.filledCircle;
import com.keypress.Gobjects.gCircle;
import java.awt.Color;

public class CircleInterior
extends filledCircle {
    public CircleInterior(GObject circle) {
        super(1);
        this.setColor(Color.yellow);
        this.AssignParent(0, circle);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gCircle circle = (gCircle)this.getParent(0);
            this.centerX = circle.centerX;
            this.centerY = circle.centerY;
            this.radius = circle.radius;
            this.updateSecondaryConstraints();
        }
    }
}


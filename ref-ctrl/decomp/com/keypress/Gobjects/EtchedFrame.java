/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Insets;
import java.awt.Panel;

public class EtchedFrame
extends Panel {
    public EtchedFrame(Component surroundedComponent) {
        this.setLayout(new BorderLayout());
        this.add("Center", surroundedComponent);
    }

    public Insets getInsets() {
        return new Insets(3, 3, 3, 3);
    }

    public void paint(Graphics g) {
        Dimension mySize = this.size();
        Insets myInsets = this.getInsets();
        g.setColor(this.getBackground().darker().darker());
        int width = mySize.width - (myInsets.left + myInsets.right) + 3;
        int height = mySize.height - (myInsets.top + myInsets.bottom) + 3;
        g.drawRect(myInsets.left - 2, myInsets.top - 2, width - 1, height - 1);
        g.setColor(this.getBackground().brighter().brighter());
        g.drawRect(myInsets.left - 1, myInsets.top - 1, width - 1, height - 1);
    }
}


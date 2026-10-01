/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gText;
import java.awt.Font;

public class PeggedText
extends gText {
    public PeggedText(Font myFont, GObject[] parents) {
        super(myFont, 2, parents, 0, 0, "");
    }

    public void Constrain(boolean locusDriving) {
        if (!locusDriving) {
            if (this.parentsExisting()) {
                gPoint anchor = (gPoint)this.getParent(0);
                gText textToCopy = (gText)this.getParent(1);
                this.msg = textToCopy.msg;
                this.baseX = (int)anchor.getX();
                this.baseY = (int)anchor.getY();
                this.existing = true;
            } else {
                this.existing = false;
            }
        }
    }
}


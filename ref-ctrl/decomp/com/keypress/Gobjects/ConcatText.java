/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gText;
import java.awt.Font;

public class ConcatText
extends gText {
    int numParentalTextToConcatenate;

    public ConcatText(int x, int y, Font myFont, GObject[] parents) {
        super(myFont, parents.length, parents, x, y, "");
        this.numParentalTextToConcatenate = parents.length;
    }

    public void Constrain(boolean locusDriving) {
        if (!locusDriving) {
            this.msg = "";
            for (int i = 0; i < this.numParentalTextToConcatenate; ++i) {
                gText aParent = (gText)this.getParent(i);
                if (!aParent.existing) continue;
                this.msg = this.msg + aParent.msg;
            }
        }
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Translator;
import com.keypress.Gobjects.gPoint;

public class VectorTranslation
extends Translator {
    gPoint foot;
    gPoint head;

    public VectorTranslation(GObject theFoot, GObject theHead) {
        this.foot = (gPoint)theFoot;
        this.head = (gPoint)theHead;
    }

    public final boolean prepareTransformer(GObject image) {
        this.deltaX = this.head.getX() - this.foot.getX();
        this.deltaY = this.head.getY() - this.foot.getY();
        return true;
    }
}


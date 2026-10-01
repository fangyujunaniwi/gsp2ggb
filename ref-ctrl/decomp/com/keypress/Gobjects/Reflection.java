/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Reflector;
import com.keypress.Gobjects.gStraight;

public class Reflection
extends Reflector {
    gStraight mirror;

    public Reflection(GObject theMirror) {
        this.mirror = (gStraight)theMirror;
    }

    public final boolean prepareTransformer(GObject image) {
        this.prepareReflection(this.mirror.x1, this.mirror.y1, this.mirror.x2, this.mirror.y2);
        return true;
    }
}


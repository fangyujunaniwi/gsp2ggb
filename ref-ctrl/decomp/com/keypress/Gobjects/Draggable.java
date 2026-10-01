/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AffectedDescendents;

public interface Draggable {
    public AffectedDescendents getAffectedDescendents();

    public void dragTo(double var1, double var3, boolean var5);

    public void dragToward(double var1, double var3, double var5);
}


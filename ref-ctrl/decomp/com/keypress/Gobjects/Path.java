/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.pathWalk;

interface Path {
    public pathWalk preparePathWalk(int var1);

    public boolean walkPath(pathWalk var1, int var2);

    public boolean getPointOnPath(pathWalk var1, double var2);

    public boolean pathIsClosed();

    public AnimatedPoint CreateAnimatedPoint(gPoint var1, Path var2, double var3, boolean var5, boolean var6);
}


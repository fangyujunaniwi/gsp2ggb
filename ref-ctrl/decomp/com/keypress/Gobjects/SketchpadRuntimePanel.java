/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import java.awt.Event;
import java.awt.Panel;

public abstract class SketchpadRuntimePanel
extends Panel {
    public void SketchpadRegisterEventHandler() {
    }

    public abstract boolean JSP_handleKey(char var1);

    abstract void JSP_mousePressed(int var1, int var2);

    public abstract void JSP_mouseReleased();

    public abstract void JSP_mouseDragged(int var1, int var2);

    public boolean keyDown(Event evt, int key) {
        return this.JSP_handleKey((char)key);
    }

    public boolean mouseDown(Event evt, int x, int y) {
        this.JSP_mousePressed(x, y);
        return true;
    }

    public boolean mouseUp(Event evt, int x, int y) {
        this.JSP_mouseReleased();
        return true;
    }

    public boolean mouseDrag(Event evt, int x, int y) {
        this.JSP_mouseDragged(x, y);
        return true;
    }
}


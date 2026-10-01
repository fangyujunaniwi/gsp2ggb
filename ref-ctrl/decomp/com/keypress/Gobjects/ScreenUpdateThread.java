/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Sketch;

public class ScreenUpdateThread
extends Thread {
    Sketch sketch;

    public ScreenUpdateThread(Sketch sketch) {
        this.sketch = sketch;
    }

    public void run() {
        while (true) {
            try {
                while (true) {
                    this.sketch.paint(this.sketch.getGraphics());
                    Thread.sleep(Sketch.FRAMERATE_MILLISECS);
                }
            }
            catch (Exception exception) {
                continue;
            }
            break;
        }
    }
}


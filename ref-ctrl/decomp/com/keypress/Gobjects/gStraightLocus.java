/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sampler;
import com.keypress.Gobjects.gStraight;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.geom.Line2D;

public class gStraightLocus
extends Sampler {
    double[] sampleX1;
    double[] sampleX2;
    double[] sampleY1;
    double[] sampleY2;

    public gStraightLocus(GObject movePoint, GObject movePath, GObject traceGObj, int numSamples) {
        super(movePoint, movePath, traceGObj, numSamples);
        this.InitializeSamplingArray();
    }

    private void InitializeSamplingArray() {
        this.sampleX1 = new double[this.numSamples];
        this.sampleX2 = new double[this.numSamples];
        this.sampleY1 = new double[this.numSamples];
        this.sampleY2 = new double[this.numSamples];
    }

    void recordSample(GObject traceGObj, int sample) {
        gStraight tracer = (gStraight)traceGObj;
        this.sampleX1[sample] = tracer.getDrawX1();
        this.sampleX2[sample] = tracer.getDrawX2();
        this.sampleY1[sample] = tracer.getDrawY1();
        this.sampleY2[sample] = tracer.getDrawY2();
    }

    public void DrawVisible(Graphics g) {
        Graphics2D g2d = (Graphics2D)g;
        this.setLineStroke(g2d);
        Line2D.Double shape = new Line2D.Double();
        this.setLineStroke(g2d);
        g2d.setPaint(this.color);
        for (int i = 0; i < this.numSamples; ++i) {
            if (!this.sampleExists[i]) continue;
            if (this.samplesAreColorized) {
                g2d.setColor(this.sampleColor[i]);
            }
            ((Line2D)shape).setLine(this.sampleX1[i], this.sampleY1[i], this.sampleX2[i], this.sampleY2[i]);
            g2d.draw(shape);
        }
    }
}


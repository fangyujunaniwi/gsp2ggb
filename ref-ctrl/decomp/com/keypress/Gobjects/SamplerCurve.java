/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Path;
import com.keypress.Gobjects.PointOnSamplerCurveAnim;
import com.keypress.Gobjects.QualifiedPoint;
import com.keypress.Gobjects.Sampler;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.pathWalk;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.geom.Line2D;

public abstract class SamplerCurve
extends Sampler
implements Path {
    double[] sampleX;
    double[] sampleY;
    boolean isClosed;

    public SamplerCurve(GObject movePoint, GObject movePath, GObject traceGObj, int numSamples) {
        super(movePoint, movePath, traceGObj, numSamples);
        this.sampleX = new double[numSamples];
        this.sampleY = new double[numSamples];
        this.isClosed = false;
    }

    public SamplerCurve(GObject myFunction, GObject myCoordSys, int numSamples) {
        super(myFunction, myCoordSys, numSamples);
        this.sampleX = new double[numSamples];
        this.sampleY = new double[numSamples];
        this.isClosed = false;
    }

    public double getSampleX(int i) {
        return this.sampleX[i];
    }

    public double getSampleY(int i) {
        return this.sampleY[i];
    }

    public boolean getSampleExists(int i) {
        return this.sampleExists[i];
    }

    public int getNumSamples() {
        return this.numSamples;
    }

    public int getGenera() {
        return 9;
    }

    public void DrawVisible(Graphics g) {
        Graphics2D g2d = (Graphics2D)g;
        Line2D.Double shape = new Line2D.Double();
        this.setLineStroke(g2d);
        g2d.setPaint(this.color);
        for (int i = 0; i < this.numSamples; ++i) {
            if (this.sampleExists[i] && this.samplesAreColorized) {
                g2d.setPaint(this.sampleColor[i]);
            }
            if (!this.sampleExists[i] || i <= 0 || !this.sampleExists[i - 1] || Math.abs(this.sampleX[i] - this.sampleX[i - 1]) > 1000.0 || Math.abs(this.sampleY[i] - this.sampleY[i - 1]) > 1000.0) continue;
            ((Line2D)shape).setLine(this.sampleX[i - 1], this.sampleY[i - 1], this.sampleX[i], this.sampleY[i]);
            g2d.draw(shape);
        }
        if (this.isClosed && this.sampleExists[0] && this.sampleExists[this.numSamples - 1]) {
            if (this.samplesAreColorized) {
                g.setColor(this.sampleColor[this.numSamples - 1]);
            }
            g.drawLine((int)Math.round(this.sampleX[0]), (int)Math.round(this.sampleY[0]), (int)Math.round(this.sampleX[this.numSamples - 1]), (int)Math.round(this.sampleY[this.numSamples - 1]));
        }
    }

    public pathWalk preparePathWalk(int numPathSamples) {
        pathWalk ret = new pathWalk();
        ret.privatePathData = (double)this.numSamples / ((double)numPathSamples - 1.0);
        return ret;
    }

    public double getApproximateLength() {
        double ret = 0.0;
        boolean prevExisted = false;
        if (!this.existing) {
            return 0.0;
        }
        for (int i = 0; i < this.numSamples; ++i) {
            if (this.getSampleExists(i)) {
                if (prevExisted) {
                    double deltaX = this.getSampleX(i) - this.getSampleX(i - 1);
                    double deltaY = this.getSampleY(i) - this.getSampleY(i - 1);
                    double dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    ret += dist;
                }
                prevExisted = true;
                continue;
            }
            prevExisted = false;
        }
        if (prevExisted && this.isClosed && this.getSampleExists(0)) {
            double deltaX = this.getSampleX(this.numSamples - 1) - this.getSampleX(0);
            double deltaY = this.getSampleY(this.numSamples - 1) - this.getSampleY(0);
            double dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            ret += dist;
        }
        return ret;
    }

    void getNearestPointOnCurve(QualifiedPoint ioPoint) {
        double nearestDistanceSquared = -1.0;
        int nearestSampleIndex = -1;
        for (int i = 0; i < this.numSamples; ++i) {
            if (!this.getSampleExists(i)) continue;
            double deltaX = this.getSampleX(i) - ioPoint.x;
            double deltaY = this.getSampleY(i) - ioPoint.y;
            double distanceToSampleSquared = deltaX * deltaX + deltaY * deltaY;
            if (nearestDistanceSquared != -1.0 && !(distanceToSampleSquared < nearestDistanceSquared)) continue;
            nearestDistanceSquared = distanceToSampleSquared;
            nearestSampleIndex = i;
        }
        boolean bl = ioPoint.exists = nearestSampleIndex > -1;
        if (ioPoint.exists) {
            ioPoint.x = this.getSampleX(nearestSampleIndex);
            ioPoint.y = this.getSampleY(nearestSampleIndex);
            ioPoint.parameter = (float)nearestSampleIndex / (float)this.getNumSamples();
        }
    }

    public boolean walkPath(pathWalk p, int sample) {
        pathWalk p2 = p;
        int mySampleIndex = (int)(p.privatePathData * (double)sample);
        boolean retExists = this.getSampleExists(mySampleIndex);
        if (retExists) {
            p2.sampleX = this.getSampleX(mySampleIndex);
            p2.sampleY = this.getSampleY(mySampleIndex);
        }
        return retExists;
    }

    public boolean pathIsClosed() {
        return this.isClosed;
    }

    public final AnimatedPoint CreateAnimatedPoint(gPoint thePoint, Path thePath, double initialSpeed, boolean onceOnly, boolean clockwise) {
        return new PointOnSamplerCurveAnim(thePoint, (SamplerCurve)thePath, initialSpeed, onceOnly, clockwise);
    }

    public abstract /* synthetic */ boolean getPointOnPath(pathWalk var1, double var2);
}


/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Path;
import com.keypress.Gobjects.PerimeteredGObj;
import com.keypress.Gobjects.PointOnCircleAnim;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.pathWalk;
import com.keypress.Gobjects.transformedCircle;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.geom.Ellipse2D;

public abstract class gCircle
extends GObject
implements PerimeteredGObj,
Path {
    double centerX;
    double centerY;
    double radius;
    int boundsTop;
    int boundsLeft;
    int boundsExtent;
    int[] iVertexY;

    int PrintSortOrder() {
        return 4000;
    }

    public int getGenera() {
        return 1;
    }

    public void DrawVisible(Graphics g) {
        Graphics2D g2d = (Graphics2D)g;
        Ellipse2D.Double shape = new Ellipse2D.Double(this.centerX - this.radius, this.centerY - this.radius, 2.0 * this.radius, 2.0 * this.radius);
        g2d.setPaint(this.color);
        this.setLineStroke(g2d);
        g2d.draw(shape);
    }

    public final double getCenterX() {
        return this.centerX;
    }

    public final double getCenterY() {
        return this.centerY;
    }

    public final double getPixelRadius() {
        return this.radius;
    }

    public gCircle(int numParents) {
        super(numParents);
        this.setColor(Color.magenta);
    }

    void updateSecondaryConstraints() {
        this.boundsExtent = 1 + (int)Math.round(2.0 * this.radius);
        this.boundsLeft = (int)Math.round(this.centerX - this.radius);
        this.boundsTop = (int)Math.round(this.centerY - this.radius);
    }

    public GObject createTransformedImage(GObject[] parents, Transformer myTransform) {
        return new transformedCircle(parents, myTransform);
    }

    public final boolean isPerimeterDefined() {
        return true;
    }

    public double getPixelPerimeterValue() {
        return Math.PI * 2 * this.radius;
    }

    public double getPixelAreaValue() {
        return Math.PI * this.radius * this.radius;
    }

    public pathWalk preparePathWalk(int numSamples) {
        pathWalk ret = new pathWalk();
        ret.privatePathData = Math.PI * 2 / (double)numSamples;
        return ret;
    }

    public boolean walkPath(pathWalk p, int sample) {
        double offset = (double)sample * p.privatePathData;
        p.sampleX = this.radius * Math.cos(offset) + this.centerX;
        p.sampleY = this.radius * Math.sin(offset) + this.centerY;
        return true;
    }

    public boolean getPointOnPath(pathWalk oReturn, double iFraction) {
        double offset = iFraction * 2.0 * Math.PI;
        oReturn.sampleX = this.radius * Math.cos(offset) + this.centerX;
        oReturn.sampleY = this.radius * Math.sin(offset) + this.centerY;
        return true;
    }

    public boolean pathIsClosed() {
        return true;
    }

    public AnimatedPoint CreateAnimatedPoint(gPoint thePoint, Path thePath, double initialSpeed, boolean onceOnly, boolean clockwise) {
        return new PointOnCircleAnim(thePoint, (gCircle)thePath, initialSpeed, onceOnly, clockwise);
    }
}


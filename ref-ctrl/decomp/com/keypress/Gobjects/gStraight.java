/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Path;
import com.keypress.Gobjects.PointOnStraightAnim;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.pathWalk;
import com.keypress.Gobjects.transformedStraight;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.geom.Line2D;

public abstract class gStraight
extends GObject
implements Path {
    double x1;
    double y1;
    double x2;
    double y2;
    double dX;
    double dY;
    double slope;
    double yintercept;
    private double drawX1;
    private double drawX2;
    private double drawY1;
    private double drawY2;
    Sketch mySketch;
    static final int _segmentType = 0;
    static final int _rayType = 1;
    static final int _lineType = 2;
    public int myStraightType;

    public final double getDrawX1() {
        return this.drawX1;
    }

    public final double getDrawX2() {
        return this.drawX2;
    }

    public final double getDrawY1() {
        return this.drawY1;
    }

    public final double getDrawY2() {
        return this.drawY2;
    }

    public final double getdX() {
        return this.dX;
    }

    public final double getdY() {
        return this.dY;
    }

    public final double getPixelLength() {
        return Math.sqrt(this.dX * this.dX + this.dY * this.dY);
    }

    public int getGenera() {
        return 2;
    }

    public gStraight(Sketch theSketch, int numParents, int straightType) {
        super(numParents);
        this.mySketch = theSketch;
        this.setColor(Color.blue);
        this.myStraightType = straightType;
    }

    public void DrawVisible(Graphics g) {
        Graphics2D g2d = (Graphics2D)g;
        Line2D.Double shape = new Line2D.Double(this.drawX1, this.drawY1, this.drawX2, this.drawY2);
        this.setLineStroke(g2d);
        g2d.setPaint(this.color);
        g2d.draw(shape);
    }

    final int PrintSortOrder() {
        return 4000;
    }

    void updateDeltas() {
        this.dX = this.x2 - this.x1;
        this.dY = this.y2 - this.y1;
        if (this.dX != 0.0) {
            this.slope = this.dY / this.dX;
            this.yintercept = this.y1 - this.slope * this.x1;
        } else if (this.dY == 0.0) {
            this.existing = false;
        }
    }

    void updateSecondaryConstraints() {
        if (this.existing) {
            switch (this.myStraightType) {
                case 2: {
                    this.updateDeltas();
                    if (!this.existing) break;
                    if (this.dX == 0.0) {
                        this.drawX1 = this.x1;
                        this.drawY1 = 0.0;
                        this.drawX2 = this.drawX1;
                        this.drawY2 = this.mySketch.size().height;
                        break;
                    }
                    if (Math.abs(this.dY) < Math.abs(this.dX)) {
                        this.drawX1 = 0.0;
                        this.drawY1 = this.yintercept;
                        this.drawX2 = this.mySketch.size().width;
                        this.drawY2 = this.drawX2 * this.slope + this.yintercept;
                        break;
                    }
                    this.drawY1 = 0.0;
                    this.drawX1 = -this.yintercept / this.slope;
                    this.drawY2 = this.mySketch.size().height;
                    this.drawX2 = (this.drawY2 - this.yintercept) / this.slope;
                    break;
                }
                case 0: {
                    this.drawX1 = this.x1;
                    this.drawX2 = this.x2;
                    this.drawY1 = this.y1;
                    this.drawY2 = this.y2;
                    this.updateDeltas();
                    break;
                }
                case 1: {
                    this.updateDeltas();
                    if (!this.existing) break;
                    this.drawX1 = this.x1;
                    this.drawY1 = this.y1;
                    if (this.dX == 0.0) {
                        this.drawX2 = this.drawX1;
                        this.drawY2 = this.dY < 0.0 ? 0.0 : (double)this.mySketch.size().height;
                        break;
                    }
                    if (Math.abs(this.dY) > Math.abs(this.dX)) {
                        if (this.dY >= 0.0) {
                            this.drawY2 = this.mySketch.size().height;
                            this.drawX2 = (this.drawY2 - this.yintercept) / this.slope;
                            break;
                        }
                        this.drawY2 = 0.0;
                        this.drawX2 = -this.yintercept / this.slope;
                        break;
                    }
                    if (this.dX >= 0.0) {
                        this.drawX2 = this.mySketch.size().width;
                        this.drawY2 = this.drawX2 * this.slope + this.yintercept;
                        break;
                    }
                    this.drawX2 = 0.0;
                    this.drawY2 = this.yintercept;
                    break;
                }
                default: {
                    System.out.print("ERR:Invalid gLineType in switch\r\n");
                }
            }
        }
    }

    public final boolean includesPoint(double x, double y) {
        if (this.myStraightType == 2) {
            return true;
        }
        if (this.y1 <= this.y2 ? y < this.y1 : y > this.y1) {
            return false;
        }
        if (this.x1 <= this.x2 ? x < this.x1 : x > this.x1) {
            return false;
        }
        if (this.myStraightType == 0) {
            if (this.x1 <= this.x2 ? x > this.x2 : x < this.x2) {
                return false;
            }
            if (this.y1 <= this.y2 ? y > this.y2 : y < this.y2) {
                return false;
            }
        }
        return true;
    }

    public GObject createTransformedImage(GObject[] parents, Transformer myTransform) {
        return new transformedStraight(parents, myTransform);
    }

    public pathWalk preparePathWalk(int numSamples) {
        pathWalk ret = new pathWalk();
        ret.privatePathData = 1.0 / ((double)numSamples - 1.0);
        return ret;
    }

    public boolean walkPath(pathWalk p, int sample) {
        double offset = (double)sample * p.privatePathData;
        p.sampleX = this.dX * offset + this.x1;
        p.sampleY = this.dY * offset + this.y1;
        return true;
    }

    public boolean getPointOnPath(pathWalk oReturn, double iFraction) {
        oReturn.sampleX = this.dX * iFraction + this.x1;
        oReturn.sampleY = this.dY * iFraction + this.y1;
        return true;
    }

    public boolean pathIsClosed() {
        return false;
    }

    public AnimatedPoint CreateAnimatedPoint(gPoint thePoint, Path thePath, double initialSpeed, boolean onceOnly, boolean clockwise) {
        return new PointOnStraightAnim(thePoint, (gStraight)thePath, initialSpeed, onceOnly, clockwise);
    }
}


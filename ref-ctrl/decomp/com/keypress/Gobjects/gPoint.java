/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.transformedPoint;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.geom.Ellipse2D;

public abstract class gPoint
extends GObject {
    double x = 0.0;
    double y = 0.0;
    double renderRadius;
    float renderRingWidth;
    static final Color _defaultPointColor = Color.black;
    static final Color _defaultFreePointColor = Color.red;
    Ellipse2D shape = null;

    public gPoint(int numParents) {
        super(numParents);
        this.setColor(_defaultPointColor);
    }

    public String toString() {
        return "Point@[" + this.x + "," + this.y + "]";
    }

    public void setPointStyle(int newStyle) {
        super.setPointStyle(newStyle);
        if (0 == this.pointStyle) {
            this.renderRadius = 2.0;
            this.renderRingWidth = 0.0f;
        } else if (1 == this.pointStyle) {
            this.renderRadius = 3.5;
            this.renderRingWidth = 1.0f;
        } else if (2 == this.pointStyle) {
            this.renderRadius = 5.0;
            this.renderRingWidth = 1.25f;
        } else {
            this.renderRadius = 7.0;
            this.renderRingWidth = 1.5f;
        }
    }

    public void DrawVisible(Graphics g) {
        Graphics2D g2d = (Graphics2D)g;
        if (null != this.shape) {
            this.shape.setFrameFromCenter(this.x, this.y, this.x + this.renderRadius, this.y + this.renderRadius);
        } else {
            this.shape = new Ellipse2D.Double(this.x - this.renderRadius, this.y - this.renderRadius, 2.0 * this.renderRadius, 2.0 * this.renderRadius);
        }
        g2d.setPaint(this.color);
        g2d.fill(this.shape);
        g2d.setPaint(Color.black);
        if (0.0 != (double)this.renderRingWidth) {
            g2d.setStroke(new BasicStroke(this.renderRingWidth));
            g2d.draw(this.shape);
        }
        if (this.hasLabel()) {
            int truncX = (int)Math.round(this.x);
            int truncY = (int)Math.round(this.y);
            g.setFont(this.myLabelFont);
            g.drawString(this.myLabel, truncX + 5, truncY);
        }
    }

    public int getGenera() {
        return 0;
    }

    public final double getX() {
        return this.x;
    }

    public final double getY() {
        return this.y;
    }

    final int PrintSortOrder() {
        return 6000;
    }

    public GObject createTransformedImage(GObject[] parents, Transformer myTransform) {
        return new transformedPoint(parents, myTransform);
    }

    public final boolean distinctFrom(gPoint anotherPoint) {
        return this.x != anotherPoint.getX() || this.y != anotherPoint.getY();
    }

    public void dragToward(double iTowardX, double iTowardY, double iMaxPixelsToMove) {
        if (this instanceof Draggable) {
            double origY;
            double dy;
            double origX = this.getX();
            double dx = iTowardX - origX;
            double distToDest = dx * dx + (dy = iTowardY - (origY = this.getY())) * dy;
            if (distToDest <= iMaxPixelsToMove * iMaxPixelsToMove) {
                origX = iTowardX;
                origY = iTowardY;
            } else {
                double theRatio = iMaxPixelsToMove / Math.sqrt(distToDest);
                origX += dx * theRatio;
                origY += dy * theRatio;
            }
            ((Draggable)((Object)this)).dragTo(origX, origY, false);
        }
    }

    public boolean isHit(int x, int y) {
        double hitRadius = this.renderRadius + 1.0;
        return this.x - hitRadius <= (double)x && this.x + hitRadius >= (double)x && this.y - hitRadius <= (double)y && this.y + hitRadius >= (double)y;
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.BleachImageFilter;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Image;
import java.awt.image.FilteredImageSource;

public abstract class gAction
extends GObject {
    int x = 0;
    int y = 0;
    int width = 0;
    int height = 0;
    int textOffsetY = 0;
    boolean metricsUninitialized = true;
    boolean clickedDown = false;
    Color backColor;
    boolean actionIsPending = false;
    boolean isImageButton;
    Component imageComponent;
    Image unclickedImage;
    Image clickedImage;
    static final Color _defaultActionColor = Color.black;
    static final int TextInsetX = 4;
    static final int TextInsetY = 2;

    public gAction(GObject[] parents, int numParents, int left, int top, Color aColor, String label, Font actionFont) {
        super(numParents);
        this.AssignParents(parents);
        this.backColor = aColor;
        this.setColor(_defaultActionColor);
        this.setLabel(label, actionFont);
        this.isImageButton = false;
        this.x = left;
        this.y = top;
    }

    public void setImage(Image theImage, Component destination) {
        this.unclickedImage = theImage;
        this.imageComponent = destination;
        this.isImageButton = true;
    }

    public String externIOItemName(int requestedItemList) {
        return requestedItemList == 1 ? this.getLabel() : null;
    }

    public void DrawVisible(Graphics g) {
        if (this.isImageButton) {
            if (g != null) {
                if (this.metricsUninitialized) {
                    this.width = this.unclickedImage.getWidth(this.imageComponent);
                    this.height = this.unclickedImage.getHeight(this.imageComponent);
                    if (this.width > 0 && this.height > 0) {
                        this.metricsUninitialized = false;
                        this.width += 4;
                        this.height += 4;
                        this.clickedImage = this.imageComponent.createImage(new FilteredImageSource(this.unclickedImage.getSource(), new BleachImageFilter(0.5)));
                    }
                }
                if (!this.metricsUninitialized) {
                    g.setColor(this.backColor);
                    g.fill3DRect(this.x, this.y, this.width, this.height, !this.clickedDown);
                    g.setColor(this.color);
                    g.draw3DRect(this.x, this.y, this.width, this.height, !this.clickedDown);
                    g.drawImage(this.clickedDown ? this.clickedImage : this.unclickedImage, this.x + 2, this.y + 2, this.imageComponent);
                }
            }
        } else {
            if (this.metricsUninitialized) {
                FontMetrics pm = g.getFontMetrics(this.myLabelFont);
                this.width = 8 + pm.stringWidth(this.myLabel);
                this.textOffsetY = 2 + pm.getAscent();
                this.height = this.textOffsetY + pm.getDescent() + 2;
                this.metricsUninitialized = false;
            }
            g.setColor(this.backColor);
            g.fill3DRect(this.x, this.y, this.width, this.height, !this.clickedDown);
            g.setColor(Color.black);
            g.draw3DRect(this.x, this.y, this.width, this.height, !this.clickedDown);
            g.setColor(this.color);
            g.setFont(this.myLabelFont);
            int clickOffset = this.clickedDown ? 1 : 0;
            g.drawString(this.myLabel, this.x + 4 + clickOffset, this.y + this.textOffsetY + clickOffset);
        }
    }

    public int getGenera() {
        return 6;
    }

    final int PrintSortOrder() {
        return 5000;
    }

    public boolean isClickable() {
        return true;
    }

    public boolean isClicked() {
        return this.clickedDown;
    }

    public abstract void handleClick(Sketch var1);

    public boolean isHit(int a, int b) {
        if (this.metricsUninitialized) {
            return false;
        }
        return this.x < a && this.x + this.width > a && this.y < b && this.y + this.height > b;
    }

    public void beginPendingAction(Sketch theSketch) {
        if (this.actionIsPending) {
            this.actionIsPending = false;
            this.handleClick(theSketch);
        }
    }

    public void QueueAction() {
        this.actionIsPending = true;
    }

    public void Constrain(boolean locusDriving) {
        this.existing = true;
    }
}


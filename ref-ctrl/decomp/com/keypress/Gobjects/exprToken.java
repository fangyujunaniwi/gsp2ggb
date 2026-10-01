/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

class exprToken {
    private int myTokenType;

    public exprToken(int theToken) {
        this.myTokenType = theToken;
    }

    public final int tokenType() {
        return this.myTokenType;
    }
}


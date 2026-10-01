/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

public class parsingSyntaxError
extends Exception {
    boolean includePrefix;

    public parsingSyntaxError(String parsingError, boolean includePrefix) {
        super(parsingError);
        this.includePrefix = includePrefix;
    }

    public String toString() {
        if (this.includePrefix) {
            return "Construction Syntax Error:\n  " + this.getMessage();
        }
        return this.getMessage();
    }
}


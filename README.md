This is an attempt to model a [RapidPro][]/[TextIt][] flow as a finite state machine
that is defined in textual source code, rather than visually as a flow diagram.

## The problem

At [JustFix.nyc][], we currently use TextIt as the "router" for all our SMS
needs: that is, whenever someone sends a text to our phone number, it's handled
by TextIt.  This was great for initial prototyping but, in some cases, has become
suboptimal in some ways as our organization has evolved:

* The only people who ever change the TextIt flows and campaigns are engineers,
  who are already fluent with code, while the primary audience of TextIt is
  non-coders. This isn't a big deal for very simple flows, but as conversation
  logic becomes more complex, we've found that it'd be easier to just write the
  "business logic" ourselves in code, rather than create a spaghetti-like flow
  diagram in TextIt.

* It can be difficult to test our flows to ensure that they work as expected; for
  instance, RapidPro/TextIt doesn't have concepts like unit testing or type safety,
  which can greatly improve reliability.

Geosite Server, Version 1.x (geosite-server)
====================================================

.. image:: https://travis-ci.org/wfp-ose/geosite-server.png
    :target: https://travis-ci.org/wfp-ose/geosite-server

Description
-----------

Geosite Server, Version 1.x (geosite-server)

Development Environment
-----------------------

To set up a development environment, use the geosite-ansible Ansible_ project.  Follow the installation_ instructions from the Ansible website to set up Ansible on your host machine.

.. _Ansible: https://www.ansible.com/
.. _installation: http://docs.ansible.com/ansible/intro_installation.html#installation

First, clone the repo into your local environment.

.. code-block:: bash

    git clone https://github.com/wfp-ose/geosite-ansible.git geosite-ansible.git
    # or
    git clone git@github.com:wfp-ose/geosite-ansible.git geosite-ansible.git

Then, configure your local Vagrantfile_ and Ansible vars_ for your environment.

.. _Vagrantfile:  https://github.com/wfp-ose/geosite-ansible/blob/master/Vagrantfile.
.. _vars: https://github.com/wfp-ose/geosite-ansible/blob/master/group_vars/all.yml

Then, to deploy, simply run vagrant up within the directory.

.. code-block:: bash

    # cd into geosite-ansible directory
    vagrant up

If you need to re-provision for any idea, just run vagrant provision and the ansible script will run again.

.. code-block:: bash

    # cd into geosite-ansible directory
    vagrant provision

By default, the guest server's web UI is available on port 8000 (http://localhost:8000/) and PostGIS is available on port 5432 with db / user / pass (geosite / geosite / geosite).

Production  Environment
-----------------------

TODO

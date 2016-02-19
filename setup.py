#!/usr/bin/env python

from setuptools import setup

setup(
    name='geosite-server',
    version='1.0.0',
    install_requires=[],
    author='Patrick Dufour',
    author_email='pjdufour.dev@gmail.com',
    license='BSD License',
    url='https://github.com/wfp-ose/geosite-server',
    keywords='python gis geosite',
    description='Geosite server.',
    long_description=open('README.rst').read(),
    download_url="https://github.com/wfp-ose/geosite-server/zipball/master",
    packages=[
        "geositeserver",
        "geositeserver.tests"],
    classifiers = [
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ]
)
